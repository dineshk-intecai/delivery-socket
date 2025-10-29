#!/usr/bin/env bash

echo "eas build pre install working --->"

# Exit immediately if a command exits with a non-zero status
set -e

# Create the SSH directory if it doesn't exist
mkdir -p ~/.ssh

# Restore the private key from the environment variable (EAS Secret)
echo $EAS_SUBMODULE_SSH_KEY | base64 --decode > ~/.ssh/id_rsa_submodule
chmod 600 ~/.ssh/id_rsa_submodule

# Add the GitHub/GitLab/Bitbucket host key to known hosts (optional, but good practice)
# Example for GitHub:
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Configure Git to use the custom SSH key for the submodule repository
# This must match the host name used in your .gitmodules file
# Example: if your submodule URL is git@github.com:user/repo.git
echo "Host github.com" >> ~/.ssh/config
echo "  IdentityFile ~/.ssh/id_rsa_submodule" >> ~/.ssh/config

# Initialize and update submodules
git submodule sync --recursive
git submodule update --init --recursive