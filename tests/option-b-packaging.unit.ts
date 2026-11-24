import {it,expect,vi,afterEach} from 'vitest';
import {optionBPackaging} from '../scripts/option-b-packaging';
vi.mock('node:fs/promises',()=>({readFile:vi.fn(async()=>Buffer.from('unapproved'))}));
afterEach(()=>vi.unstubAllEnvs());
it('blocks ordinary public builds before emitting private bytes',async()=>{vi.stubEnv('OUTRUN_PRIVATE_PREVIEW','');const emitFile=vi.fn();await expect((optionBPackaging().buildStart as Function).call({emitFile})).rejects.toThrow('GLOBAL RELEASE BLOCKED');expect(emitFile).not.toHaveBeenCalled();});
it('rejects unapproved bytes even for a private preview',async()=>{vi.stubEnv('OUTRUN_PRIVATE_PREVIEW','1');const emitFile=vi.fn();await expect((optionBPackaging().buildStart as Function).call({emitFile})).rejects.toThrow('hash mismatch');expect(emitFile).not.toHaveBeenCalled();});
