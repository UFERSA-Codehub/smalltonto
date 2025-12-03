#!/bin/bash
#
# Generate PR Body
# This script generates the PR body markdown file with commit and file change information.
#
# Required environment variables:
#   BRANCH - The branch name
#
# Optional environment variables:
#   AI_SUCCESS - Whether AI summary was generated ("true" or "false")
#   AI_SUMMARY - AI-generated summary text
#   AI_TECH_NOTES - AI-generated tech notes
#
# Output:
#   Creates pr_body.md in the current directory
#

set -e

# Ensure BRANCH is set
if [ -z "$BRANCH" ]; then
  echo "Error: BRANCH environment variable is required"
  exit 1
fi

# Fetch master branch for comparison
git fetch origin master:master 2>/dev/null || git fetch origin main:master 2>/dev/null || true

# Get all commits in this branch that aren't in master
COMMITS=$(git log master..HEAD --pretty=format:"- %s (%h) - %an" 2>/dev/null | head -20 || echo "No commits found")
COMMIT_COUNT=$(git rev-list --count master..HEAD 2>/dev/null || echo "0")

# Get changed files summary
FILES_CHANGED=$(git diff --name-only master..HEAD 2>/dev/null | wc -l | tr -d ' ')
FILES_LIST=$(git diff --name-only master..HEAD 2>/dev/null | head -10 | sed 's/^/- /' || echo "No files changed")

# Generate tree-style file list with new file indicators
TREE_OUTPUT=""
while IFS= read -r file; do
  [ -z "$file" ] && continue
  # Check if file is new (added)
  if git diff --name-status master..HEAD 2>/dev/null | grep -q "^A[[:space:]]$file$"; then
    TREE_OUTPUT+="_new_ \`$file\`"$'\n'
  else
    TREE_OUTPUT+="\`$file\`"$'\n'
  fi
done < <(git diff --name-only master..HEAD 2>/dev/null | head -20)

# Check if we have more commits/files to show
MORE_COMMITS=""
if [ "$COMMIT_COUNT" -gt 20 ] 2>/dev/null; then
  MORE_COMMITS="_...e mais $(($COMMIT_COUNT - 20)) commits_"
fi

MORE_FILES=""
if [ "$FILES_CHANGED" -gt 10 ] 2>/dev/null; then
  MORE_FILES="_...e mais $(($FILES_CHANGED - 10)) arquivos_"
fi

LAST_UPDATED=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Use AI summary if available
if [ "$AI_SUCCESS" = "true" ]; then
  cat > pr_body.md <<EOF
## 🤖 Resumo

${AI_SUMMARY}

**Notas Técnicas:** ${AI_TECH_NOTES}

---

## 📊 Detalhes

**Branch:** \`${BRANCH}\`  
**Total de Commits:** ${COMMIT_COUNT}  
**Arquivos Alterados:** ${FILES_CHANGED}

## 📝 Commits

${COMMITS}

${MORE_COMMITS}

## 📂 Arquivos Alterados

${TREE_OUTPUT}

${MORE_FILES}

---

### ✅ Checklist
- [ ] Código revisado
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Pronto para merge

---

_🤖 Este PR foi criado automaticamente e é atualizado a cada push._  
_Última atualização: ${LAST_UPDATED}_
EOF
else
  # Fallback to basic summary without AI
  cat > pr_body.md <<EOF
## 🚀 Resumo

**Branch:** \`${BRANCH}\`  
**Total de Commits:** ${COMMIT_COUNT}  
**Arquivos Alterados:** ${FILES_CHANGED}

## 📝 Commits

${COMMITS}

${MORE_COMMITS}

## 📂 Arquivos Alterados

${TREE_OUTPUT}

${MORE_FILES}

---

### ✅ Checklist
- [ ] Código revisado
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Pronto para merge

---

_🤖 Este PR foi criado automaticamente e é atualizado a cada push._  
_Última atualização: ${LAST_UPDATED}_
EOF
fi

echo "✅ Generated pr_body.md successfully"
