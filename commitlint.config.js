/**
 * Commit convention per docs/11-Development/144. Conventional-Commits base with
 * the project's extended type set (adds `security` and `content`).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'perf', 'security', 'content', 'revert'],
    ],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
  },
};
