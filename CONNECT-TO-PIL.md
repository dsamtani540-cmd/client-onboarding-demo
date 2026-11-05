# Connect this app to PIL and release the passport feature

This takes about 20 minutes the first time. You need Git, Node 22 and a GitHub account.

What will happen: PIL's AI team reads this repository, commits the "Flag expired passports at intake" change to a branch, opens a pull request, waits for the tests in GitHub Actions and deploys to staging. After you approve the release, it merges the pull request and deploys to production. You'll see the change on both web addresses.

## 1. Put the app on GitHub

Create an empty **public** repository named `client-onboarding-demo` on github.com: no README, no .gitignore. Free GitHub accounts can only publish public repositories with GitHub Pages, and this app holds sample data only.

Then, in PowerShell:

```powershell
cd "C:\Users\Daniel\Documents\ERP Product Management Tool\client-onboarding-demo"
# The two GitHub Actions workflows arrive in "workflows-to-move"; put them where GitHub looks for them
New-Item -ItemType Directory -Force .github\workflows | Out-Null
Move-Item workflows-to-move\*.yml .github\workflows\
Remove-Item workflows-to-move
git init -b main
git add -A
git commit -m "Client Onboarding test app"
git remote add origin https://github.com/YOUR-USER/client-onboarding-demo.git
git push -u origin main
```

## 2. Publish the first version

1. On GitHub, open the repository → **Actions** → **deploy** → **Run workflow** → environment **production** → **Run workflow**. Wait for the green tick (about a minute). This creates the `gh-pages` branch.
2. **Settings** → **Pages** → Build and deployment → Source: **Deploy from a branch** → Branch: **gh-pages**, folder **/ (root)** → **Save**.
3. After a minute or two, open `https://YOUR-USER.github.io/client-onboarding-demo/`. The queue shows CO-1002 (Northgate Capital) as **Ready for screening**, even though Marc Weber's passport has expired. That is the problem the feature fixes.

## 3. Give PIL a token for this repository only

github.com → your picture → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**:

- Repository access: **Only select repositories** → `client-onboarding-demo`
- Repository permissions:
  - **Contents**: Read and write
  - **Pull requests**: Read and write
  - **Actions**: Read and write
  - **Pages**: Read-only (optional)

Copy the token (it starts with `github_pat_`). Treat it like a password: it stays on your computer, in the PIL server only.

## 4. Start PIL with the token

```powershell
cd "C:\Users\Daniel\Documents\ERP Product Management Tool\v3\pil-prototype"
$env:PIL_GITHUB_TOKEN = "github_pat_PASTE_YOURS_HERE"
npm install
npm run build:web
npm run start:memory
```

The console should say **Real GitHub connections available**. Open http://localhost:8787 and keep the PowerShell window open while the change runs.

## 5. Connect Client Onboarding to the repository

1. On the start page choose **Ravi Menon**, then **Client Onboarding**.
2. **Technical → Connections**:
   - **Code hosting:** **Disconnect** (it is on simulated Azure DevOps), choose **GitHub**, enter `YOUR-USER/client-onboarding-demo`, tick **Use the real GitHub connection**, **Connect**.
   - **CI/CD:** choose **GitHub Actions**, enter the same repository, tick **Use the real GitHub connection**, **Connect**.
3. **Technical → System map** → **Read my code** → check the three parts it found (KYC Checks, Intake Screens, Feature Flags) → **This looks right: confirm**.

## 6. Release the passport feature

The change **Flag expired passports at intake** was waiting for the system map, and now continues.

1. **Approvals:** answer the AI team's questions, choose an option, and accept the risk. The change touches KYC Checks, which the system map marks as regulated.
2. The change shows **Running in GitHub** while it works. Watch on GitHub:
   - a branch `pil/chg-…` and a pull request
   - the **ci** run on the pull request
   - a **deploy** run to staging
3. Open `https://YOUR-USER.github.io/client-onboarding-demo/staging/`. It has a yellow STAGING bar, and CO-1002 now shows **Expired passport** and **Needs information**.
4. **Approvals → Approve the release.** PIL merges the pull request, runs **deploy** to production, and checks that the site serves the new commit.
5. Production now flags the expired passport. **Health & releases** links to the pull request, the test run and both deployments.

If a test or deploy fails, the change shows **Stopped** with a link to the run. Fix it on GitHub, then press **Try again**.

## Running it again

- `start:memory` forgets PIL's data when you stop it. Use `npm start` with PostgreSQL to keep it.
- To repeat the test from the start, revert the merged pull request on GitHub (open it → **Revert**, then merge the revert) and redeploy production. Restart PIL.
- The AI team is a scripted stand-in. It can only commit prepared changes: this passport change is in PIL's `data/ops/prepared-changes/`. Any other change will stop at Build and say so.
