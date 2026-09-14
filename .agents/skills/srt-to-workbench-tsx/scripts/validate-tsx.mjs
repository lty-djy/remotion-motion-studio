import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';

// Validates trusted, agent-authored source. This is NOT an untrusted-code sandbox.
const [input,rootArg]=process.argv.slice(2);
if(!input){console.error('Usage: node validate-tsx.mjs file.tsx [workbench-root]');process.exit(2);}
const root=resolve(rootArg||process.cwd()), file=resolve(input);
const requireFromProject=createRequire(join(root,'package.json'));
const {build,transform}=requireFromProject('esbuild');
const source=readFileSync(file,'utf8');
const config=readFileSync(join(root,'local-vite.config.ts'),'utf8');
const start=config.indexOf('const validateComponent =');
const end=config.indexOf('const normalizeComponent =',start);
if(start<0||end<start)throw new Error('Current validator location changed; inspect local-vite.config.ts before updating this helper.');
const validator=await transform(config.slice(start,end)+'\nvalidateComponent(candidate);',{loader:'ts'});
runInNewContext(validator.code,{candidate:source},{timeout:5000});
const out=mkdtempSync(join(tmpdir(),'workbench-tsx-check-'));
const sourceOut=join(out,'component.cjs'),protocolOut=join(out,'protocol.cjs');
await build({stdin:{contents:source,loader:'tsx',resolveDir:root,sourcefile:file},outfile:sourceOut,bundle:true,format:'cjs',platform:'node',external:['react','remotion']});
await build({entryPoints:[join(root,'local-protocol.ts')],outfile:protocolOut,bundle:true,format:'cjs',platform:'node'});
function load(codePath){const m={exports:{}};runInNewContext(readFileSync(codePath,'utf8'),{module:m,exports:m.exports,require:requireFromProject,console},{timeout:10000});return m.exports;}
const module=load(sourceOut), protocol=load(protocolOut);
const fps=protocol.getNumberExport(module,['WECHAT_VIDEO_FPS','LOCAL_COMPONENT_FPS','FPS'],30);
const duration=protocol.getNumberExport(module,['WECHAT_VIDEO_DURATION_IN_FRAMES','LOCAL_COMPONENT_DURATION_IN_FRAMES','DURATION_IN_FRAMES'],0);
if(!Number.isFinite(fps)||fps<=0||!Number.isInteger(duration)||duration<1)throw new Error('Export a valid FPS and positive integer duration.');
const defs=protocol.getMotionComponents(module,duration),timeline=protocol.getMotionTimeline(module);
if(!Array.isArray(module.MOTION_COMPONENTS)||!defs.length||defs.length!==module.MOTION_COMPONENTS.length)throw new Error('Manifest entries must all resolve to renderable components.');
const ids=new Set(defs.map(d=>d.id));
if(ids.size!==defs.length)throw new Error('Duplicate component ID.');
if(!timeline.length)throw new Error('No timeline presets.');
for(const p of timeline){if(!ids.has(p.componentId)||!Number.isInteger(p.startFrame)||p.startFrame<0||!Number.isInteger(p.durationInFrames)||p.durationInFrames<1||p.startFrame+p.durationInFrames>duration)throw new Error('Invalid preset reference or timing: '+JSON.stringify(p));}
for(const d of defs){if(!Object.keys(d.propsSchema).length)throw new Error('Expose editable parameters for '+d.id);for(const key of Object.keys(d.propsSchema)){if(!(key in d.defaultProps))throw new Error('Missing default prop '+d.id+'.'+key);}}
const report={result:'PASS',file,root,fps,durationInFrames:duration,components:defs.map(d=>({id:d.id,bounds:d.bounds,editableProperties:Object.keys(d.propsSchema)})),timeline,limits:'Source safety and protocol only. Browser visuals, actual UI import, face avoidance and media still require separate checks.'};
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({result:'PASS',components:defs.length,presets:timeline.length,fps,durationInFrames:duration,report:join(out,'report.json')},null,2));
