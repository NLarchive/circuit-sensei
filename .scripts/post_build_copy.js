const fs = require('fs');
const path = require('path');

const copy = async (src, dest) => {
  if (!fs.existsSync(src)) return;
  await fs.promises.mkdir(dest, { recursive: true });

  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copy(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
};

(async () => {
  const root = process.cwd();
  const dist = path.join(root, 'dist');

  try {
    if (!fs.existsSync(dist)) {
      console.warn('dist/ not found, skipping copy of static assets.');
      process.exit(0);
    }

    // Copy story and data into dist root so runtime fetch() can access them
    await copy(path.join(root, 'story'), path.join(dist, 'story'));
    await copy(path.join(root, 'data'), path.join(dist, 'data'));

    console.log('Post-build: copied story/ and data/ to dist/');
  } catch (err) {
    console.error('Post-build copy failed:', err);
    process.exit(1);
  }
})();