// GitHub API ke initial setup ke liye chota sa wait
const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // STEP 1: Verification
    onProgress('Verifying account...');
    const userRes = await fetch(`${baseUrl}/user`, { headers });
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions.');
    const userData = await userRes.json();
    const owner = userData.login;

    // STEP 2: Create Repo (auto_init: true zaroori hai "Empty Repo" error se bachne ke liye)
    onProgress('Creating repository...');
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repoName,
        private: true,
        auto_init: true // 100% required taaki blobs push ho sakein
      }),
    });

    if (!repoRes.ok) {
        const errorData = await repoRes.json();
        throw new Error(`Repo creation failed: ${errorData.message}`);
    }
    const repoData = await repoRes.json();
    const branch = repoData.default_branch || 'main';

    onProgress('Warming up GitHub database...');
    await wait(3000); 

    // STEP 3: Create Blobs (Har file path ko filter aur clean karna)
    const treeItems = [];
    const safeFiles = files.filter(f => {
        const p = f.path.toLowerCase();
        // Faltu aur hidden files ko strict ignore
        return p && !p.includes('.git/') && !p.includes('.ds_store') && !p.includes('__macosx');
    });

    for (let i = 0; i < safeFiles.length; i++) {
      const file = safeFiles[i];
      onProgress(`Uploading files (${i + 1}/${safeFiles.length})...`);

      // Path ko properly clean karna
      const cleanPath = file.path.split('/').filter(Boolean).join('/');

      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: file.content || "", encoding: 'base64' }),
      });

      if (!blobRes.ok) {
        const blobErr = await blobRes.json();
        throw new Error(`Blob failed for ${cleanPath}: ${blobErr.message}`);
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // STEP 4: Build Tree (THE MAGIC: No Base Tree!)
    onProgress('Building fresh folder structure...');
    // Yahan humne base_tree bhejna band kar diya hai, jisse "Not Found" ka chakkar hi khatam ho gaya
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }), 
    });

    if (!treeRes.ok) {
        const treeErr = await treeRes.json();
        throw new Error(`Tree creation failed: ${treeErr.message}`);
    }
    const treeData = await treeRes.json();

    // STEP 5: Create a "Root" Commit (No Parents)
    onProgress('Committing code...');
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: '🚀 Initial project upload via JSS Mobile Uploader',
        tree: treeData.sha,
        // DHYAN DEIN: Yahan 'parents' array nahi hai. Yeh ek fresh history banayega!
      }),
    });

    if (!commitRes.ok) {
        const commitErr = await commitRes.json();
        throw new Error(`Commit failed: ${commitErr.message}`);
    }
    const commitData = await commitRes.json();

    // STEP 6: Force Push to Branch
    onProgress('Finalizing force push...');
    let pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha, force: true }), // FORCE TRUE laga diya
    });

    // Fallback: Agar GitHub ne branch banayi hi nahi hai abhi tak, toh hum khud branch bana denge
    if (!pushRes.ok) {
       pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commitData.sha }),
       });
       
       if (!pushRes.ok) {
          const pushErr = await pushRes.json();
          throw new Error(`Final push failed: ${pushErr.message}`);
       }
    }

    return `https://github.com/${owner}/${repoName}`;

  } catch (error) {
    console.error("GitHub API Error:", error);
    throw error;
  }
}
