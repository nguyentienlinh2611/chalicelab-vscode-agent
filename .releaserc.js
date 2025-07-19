module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false, // We don't publish to npm, only update package.json version
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
  preset: 'conventionalcommits',
  releaseRules: [
    { type: 'feat', release: 'minor' },
    { type: 'fix', release: 'patch' },
    { type: 'perf', release: 'patch' },
    { type: 'revert', release: 'patch' },
    { type: 'docs', release: false },
    { type: 'style', release: false },
    { type: 'chore', release: false },
    { type: 'refactor', release: 'patch' },
    { type: 'test', release: false },
    { type: 'build', release: false },
    { type: 'ci', release: false },
    { breaking: true, release: 'major' },
  ],
  parserOpts: {
    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
  },
  writerOpts: {
    commitsSort: ['subject', 'scope'],
  },
};
