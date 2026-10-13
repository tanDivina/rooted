#!/bin/zsh
# Create the least-privilege IAM user Rooted's server uses (SES email, SNS texts,
# Bedrock, Transcribe streaming) and append its keys to .env.local (gitignored).
# Run once with admin credentials: ./scripts/aws/create_app_user.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

USER_NAME=rooted-app
REGION=${AWS_REGION:-us-east-1}

aws iam create-user --user-name $USER_NAME --tags Key=project,Value=rooted --query 'User.Arn' --output text
aws iam put-user-policy --user-name $USER_NAME --policy-name rooted-app-minimal \
  --policy-document file://scripts/aws/rooted-app-policy.json

umask 077
keys=$(aws iam create-access-key --user-name $USER_NAME --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
{
  echo ""
  echo "# AWS: IAM user $USER_NAME (SES, SNS publish, Bedrock invoke, Transcribe streaming only)"
  echo "AWS_ACCESS_KEY_ID=${keys%%$'\t'*}"
  echo "AWS_SECRET_ACCESS_KEY=${keys#*$'\t'}"
  echo "AWS_REGION=$REGION"
} >> .env.local
chmod 600 .env.local
echo "Done: keys for $USER_NAME added to .env.local"
