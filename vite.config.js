import { defineConfig } from 'vite';

export default defineConfig(() => {
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];

  return {
    // GitHub Pages is hosted at https://<owner>.github.io/<repo>/
    // so assets must be built with that base path.
    base: isGitHubActions && repoName ? `/${repoName}/` : '/',
  };
});
