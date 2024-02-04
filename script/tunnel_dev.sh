#! /bin/sh
echo "Tunneling to mysql in staging env"
ssh -fN -L 3308:localhost:3306 -p 16889 sbase-dev-main