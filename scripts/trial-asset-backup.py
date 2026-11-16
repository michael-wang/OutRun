"""Bounded local copy/restore trial. No Git writes, network, deletion or overwrite."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    'art/reference/coast/03_STYLE_B_coastal_highway.png',
    'art/reference/coast/README.md',
    'public/assets/characters/coast-blonde-r6d.glb',
    'docs/art-review/r6d/README.md',
    'asset-pipeline/pilot.json',
)
MASTER_EXTENSIONS = {'.blend', '.blend1', '.psd', '.kra', '.xcf', '.ai', '.svg',
                     '.rpp', '.aup', '.aup3', '.als', '.flp', '.logicx', '.mid', '.midi'}

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', help='full commit SHA to inventory; defaults to HEAD')
    parser.add_argument('--output', type=Path, help='new directory outside repository; never reused')
    args = parser.parse_args()
    revision = args.ref or git('rev-parse', 'HEAD')
    if not re.fullmatch(r'[a-f0-9]{40}', revision):
        raise ValueError('--ref must be a full lowercase commit SHA')
    revision = git('rev-parse', '--verify', revision + '^{commit}')
    paths = git('ls-tree', '-r', '--name-only', revision).splitlines()
    status_before = git('status', '--porcelain=v1', '--untracked-files=all')
    records, payloads = [], {}
    for name in FILES:
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT) or name not in paths:
            raise ValueError(f'not a tracked in-repository trial file: {name}')
        if path.stat().st_size > 10 * 1024 * 1024:
            raise ValueError(f'trial file exceeds 10 MiB bound: {name}')
        data = path.read_bytes()
        if data.startswith(b'version https://git-lfs.github.com/spec/v1'):
            raise ValueError(f'not hydrated bytes: {name}')
        oid = git('rev-parse', revision + ':' + name)
        if git('hash-object', str(path)) != oid:
            raise ValueError(f'working bytes differ from selected commit: {name}')
        records.append({'path': name, 'gitBlob': oid, 'bytes': len(data), 'sha256': sha(data)})
        payloads[name] = data
    if sum(len(v) for v in payloads.values()) > 20 * 1024 * 1024:
        raise ValueError('trial exceeds 20 MiB total bound')
    if args.output:
        output = args.output.resolve()
        if output.is_relative_to(ROOT):
            raise ValueError('output must be outside repository')
        output.mkdir(parents=False, exist_ok=False)
    else:
        temp_root = Path(tempfile.gettempdir()).resolve()
        if temp_root.is_relative_to(ROOT):
            raise ValueError('temporary directory must be outside repository')
        output = Path(tempfile.mkdtemp(prefix='outrun-p0-3-restore-', dir=temp_root)).resolve()
    archive = output / 'sample.zip'
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_STORED) as bundle:
        for name, data in payloads.items():
            bundle.writestr(name, data)
    restored = output / 'restored'
    restored.mkdir()
    with zipfile.ZipFile(archive) as bundle:
        if bundle.namelist() != list(FILES):
            raise ValueError('archive members changed')
        for row in records:
            # Do not extract arbitrary archive paths; only the fixed allowlist above.
            data = bundle.read(row['path'])
            target = restored / row['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as stream:
                stream.write(data)
            if sha(target.read_bytes()) != row['sha256']:
                raise ValueError('restored checksum mismatch')
            if sha((ROOT / row['path']).read_bytes()) != row['sha256']:
                raise ValueError('source changed during trial')
    if git('status', '--porcelain=v1', '--untracked-files=all') != status_before:
        raise ValueError('repository status changed during trial')
    extensions = dict(sorted(collections.Counter(Path(p).suffix.lower() or '<none>' for p in paths).items()))
    result = {'status': 'PASS local byte-restore trial only', 'snapshot': revision,
              'trackedPathCount': len(paths), 'extensionCounts': extensions,
              'masterCandidatesByExtension': [p for p in paths if Path(p).suffix.lower() in MASTER_EXTENSIONS],
              'trackedLfsConfig': [p for p in paths if Path(p).name in {'.gitattributes', '.lfsconfig'}],
              'files': records, 'archive': str(archive), 'archiveSha256': sha(archive.read_bytes()),
              'restoredDirectory': str(restored), 'repositoryStatusUnchanged': True,
              'limits': ['same-machine copy, not an independent backup', 'no editable master available',
                         'no Blender/audio project open, deployment or LFS test',
                         'all trial files left in place; no deletion performed']}
    with (output / 'result.json').open('x', encoding='utf8') as stream:
        json.dump(result, stream, indent=2, ensure_ascii=False)
        stream.write('\n')
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
