rimraf ./bin
pnpm run build
pnpm test
license-checker --unknown --exclude 'MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC-BY-4.0, CC-BY-3.0, CC0-1.0'
