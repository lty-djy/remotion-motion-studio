import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build,transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const folder=new URL('./',import.meta.url);
const source=readFileSync(new URL('EarringStudy.tsx',folder),'utf8');
const config=readFileSync(new URL('../../local-vite.config.ts',folder),'utf8');
const validation=config.slice(config.indexOf('const validateComponent ='),config.indexOf('const normalizeComponent ='));
const compiled=await transform(validation+'\nvalidateComponent(candidate);',{loader:'ts'});
runInNewContext(compiled.code,{candidate:source});
await build({entryPoints:[fileURLToPath(new URL('EarringStudy.tsx',folder))],outfile:fileURLToPath(new URL('verified-module.mjs',folder)),bundle:true,format:'esm',platform:'node',external:['react','remotion']});
await build({entryPoints:[fileURLToPath(new URL('../../local-protocol.ts',folder))],outfile:fileURLToPath(new URL('verified-protocol.mjs',folder)),bundle:true,format:'esm',platform:'node'});
const module=await import(new URL('verified-module.mjs',folder));
const protocol=await import(new URL('verified-protocol.mjs',folder));
const defs=protocol.getMotionComponents(module,286),timeline=protocol.getMotionTimeline(module);
if(defs.length!==2||timeline.length!==2) throw new Error('Expected two editable components and two presets');
for(const d of defs){if(typeof d.component!=='function'||d.bounds.y+d.bounds.height>864)throw new Error('Invalid component or subtitle overlap');}
for(const p of timeline){if(p.startFrame!==0||p.durationInFrames!==286)throw new Error('Timing mismatch');}
const report={safetyValidator:'PASS (current local-vite.config.ts)',protocol:'PASS (current local-protocol.ts)',components:defs.map(d=>({id:d.id,parameters:Object.keys(d.propsSchema).length})),timeline,fps:30,durationSeconds:286/30,externalAssets:0};
writeFileSync(new URL('verification.json',folder),JSON.stringify(report,null,2));
console.log(JSON.stringify({safety:'PASS',protocol:'PASS',components:defs.length,presets:timeline.length,fps:30,durationFrames:286}));

