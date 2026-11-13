import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

it('R5c: shore pre-build uses a source-fingerprint cache, not a blind stale asset',()=>{
 const program='scripts/bake-coast-shore.mjs';
 const syntax=spawnSync(process.execPath,['--check',program],{encoding:'utf8'});
 expect(syntax.status,syntax.stderr).toBe(0);
 const source=readFileSync(program,'utf8');
 expect(source).toContain("checksum.update(COAST_SHORE_KEY)");
 expect(source).toContain("src/coast-shore-index.ts");
 expect(source).toContain("oldStamp.trim()===stamp&&existing.size>1024");
 expect(source).toContain("if(reusable){");
 expect(source).toContain("await writeFile(assetPath,compressed)");
 expect(source).toContain("await writeFile(stampPath,stamp)");
});
