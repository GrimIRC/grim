
     server {
            listen       80;
            server_name  smc;

            access_log  /var/log/nginx/access_speedmodeling.log;
            error_log  /var/log/nginx/error_speedmodeling.log;
            root   /home/doug/codebase/smcman/www;
           	index  index.html index.htm;

            location /socket.io/ {
                    proxy_pass http://localhost:8001;
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection "upgrade";
            }

           	location /api/ {
                   	proxy_pass http://localhost:8001/api/;
            }

            location /view/ {
                   	proxy_pass http://localhost:8001/view/;
            }


            ## send request back to apache1 ##
    }
