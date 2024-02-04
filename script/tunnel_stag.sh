#! /bin/sh
#! /bin/sh
echo "Tunneling to mysql in dev env"
ssh -fN -L 3307:localhost:3306 -p 16889 sbase-staging-main