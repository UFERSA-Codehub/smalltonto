#!/bin/bash
#
# Generate AI PR Summary using Groq API
# This script calls the Groq API to generate an AI-powered PR summary.
#
# Required environment variables:
#   BRANCH - The branch name
#   GROQ_API_KEY - Groq API key for authentication
#   GITHUB_OUTPUT - GitHub Actions output file path
#
# Output:
#   Writes to GITHUB_OUTPUT:
#     ai_title - AI-generated PR title
#     ai_summary - AI-generated summary
#     ai_tech_notes - AI-generated tech notes
#     ai_success - "true" if successful, "false" otherwise
#

set -e

# Ensure required variables are set
if [ -z "$BRANCH" ]; then
  echo "Error: BRANCH environment variable is required"
  exit 1
fi

if [ -z "$GROQ_API_KEY" ]; then
  echo "Warning: GROQ_API_KEY not set, skipping AI summary"
  echo "ai_success=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

if [ -z "$GITHUB_OUTPUT" ]; then
  echo "Error: GITHUB_OUTPUT environment variable is required"
  exit 1
fi

# Fetch master branch for comparison
git fetch origin master:master 2>/dev/null || git fetch origin main:master 2>/dev/null || true

# Collect context for AI
COMMIT_MESSAGES=$(git log master..HEAD --pretty=format:"%s" 2>/dev/null | head -20 || echo "No commits")
FILES_CHANGED=$(git diff --name-only master..HEAD 2>/dev/null | head -20 || echo "No files")
DIFF_STAT=$(git diff master..HEAD --stat 2>/dev/null | head -30 || echo "No diff stats")

# Build and escape prompt for JSON
echo "Building AI prompt..."
PROMPT=$(printf '%s\n' \
  "Analyze these git changes and generate a PR summary in Portuguese (pt-BR):" \
  "" \
  "Branch: $BRANCH" \
  "" \
  "Commit messages:" \
  "$COMMIT_MESSAGES" \
  "" \
  "Files changed:" \
  "$FILES_CHANGED" \
  "" \
  "Diff stats:" \
  "$DIFF_STAT" \
  "" \
  "Generate:" \
  "1. A concise PR title (max 60 chars, in Portuguese, descriptive and human-readable)" \
  "2. A 2-3 sentence summary (in Portuguese) explaining WHAT this PR does and WHY" \
  "3. Mention if it introduces new technologies, major refactoring, or significant changes" \
  "4. Use proper formatting to make it more visually readable, instead of a bare summary." \
  "" \
  "Format your response EXACTLY as:" \
  "TITLE: <title here>" \
  "SUMMARY: <summary here>" \
  "TECH_NOTES: <tech notes here or 'Nenhuma mudança significativa de tecnologia'>" \
  | jq -Rs .)

echo "Prompt built successfully (length: ${#PROMPT} chars)"

# Call Groq API
echo "Calling Groq API..."
set +e  # Temporarily disable exit on error

RESPONSE=$(curl -s -w "|||HTTP_STATUS:%{http_code}|||" https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"llama-3.3-70b-versatile\",
    \"messages\": [
      {
        \"role\": \"system\",
        \"content\": \"You are a code review assistant. Analyze git changes and create concise, professional PR summaries in Portuguese.\"
      },
      {
        \"role\": \"user\",
        \"content\": $PROMPT
      }
    ],
    \"temperature\": 0.5,
    \"max_tokens\": 400
  }" 2>&1)

CURL_EXIT=$?
set -e  # Re-enable exit on error

# Extract HTTP status and response body
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed 's/|||HTTP_STATUS:[0-9]*|||//')

echo "Curl exit code: $CURL_EXIT"
echo "HTTP status: $HTTP_STATUS"
echo "Response length: ${#RESPONSE_BODY} chars"

# Check if API call succeeded
if [ $CURL_EXIT -eq 0 ] && [ "$HTTP_STATUS" = "200" ]; then
  AI_CONTENT=$(echo "$RESPONSE_BODY" | jq -r '.choices[0].message.content // empty')
  
  if [ -n "$AI_CONTENT" ]; then
    echo "✅ AI summary generated successfully"
    echo "$AI_CONTENT"
    
    # Parse AI response
    PR_TITLE=$(echo "$AI_CONTENT" | grep "TITLE:" | sed 's/TITLE: *//' | head -1)
    PR_SUMMARY=$(echo "$AI_CONTENT" | grep "SUMMARY:" | sed 's/SUMMARY: *//' | head -1)
    TECH_NOTES=$(echo "$AI_CONTENT" | grep "TECH_NOTES:" | sed 's/TECH_NOTES: *//' | head -1)
    
    # Save to output
    {
      echo "ai_title=$PR_TITLE"
      echo "ai_summary=$PR_SUMMARY"
      echo "ai_tech_notes=$TECH_NOTES"
      echo "ai_success=true"
    } >> "$GITHUB_OUTPUT"
    
    echo "Title: $PR_TITLE"
  else
    echo "⚠️ AI response was empty, using fallback"
    echo "API Response: $RESPONSE_BODY"
    echo "ai_success=false" >> "$GITHUB_OUTPUT"
  fi
else
  echo "⚠️ Groq API call failed, using fallback"
  echo "Curl exit code: $CURL_EXIT"
  echo "HTTP status: $HTTP_STATUS"
  echo "Response body: $RESPONSE_BODY"
  echo "ai_success=false" >> "$GITHUB_OUTPUT"
fi
