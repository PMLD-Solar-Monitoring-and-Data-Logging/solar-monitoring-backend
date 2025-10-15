#!/bin/bash

# 1. Create the CA key
openssl ecparam -name prime256v1 -genkey -noout -out ca.key

# 2. Create a self-signed CA certificate via CSR -> sign yourself
openssl req -new -key ca.key -subj "/CN=ThingsBoard Local CA" -out ca.csr

# 3. Sign it yourself with proper extensions
openssl x509 -req -in ca.csr -signkey ca.key \
  -out ca.crt -days 3650 -sha256 -extfile ca.ext

# --- Create server key + CSR ---
openssl ecparam -name prime256v1 -genkey -noout -out server.key
openssl req -new -key server.key \
  -subj "/CN=tb.mydomain.com" \
  -out server.csr

# --- Create server key + CSR ---
openssl ecparam -name prime256v1 -genkey -noout -out server.key
openssl req -new -key server.key \
  -subj "/CN=tb.example.com" \
  -out server.csr

# --- Sign server cert with CA (valid ~2.25 years) ---
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 825 -sha256 -extfile server.ext

# --- Quick sanity checks ---
# 1) Key ↔ cert match
openssl x509 -noout -in server.crt | openssl md5
openssl pkey -noout -in server.key | openssl md5
# hashes must be identical

# 2) Show SAN present
openssl x509 -noout -text -in server.crt | grep -A1 "Subject Alternative Name"

# copy cert to config directory
mkdir -p ../.docker/thingsboard-config
cp server.crt ../.docker/thingsboard-config/server.pem
cp server.key ../.docker/thingsboard-config/server_key.pem
sudo chown -R 799:799 ../.docker/thingsboard-config../.docker/thingsboard-config
echo "Client ca-file: ca.crt"
