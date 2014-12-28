Needs more docs -- but the general idea is to add this to your apache config:

I like just using a generic server name like "smc" then add "smc" to your hosts file while connected via vpn (for example) like, add to /etc/hosts or C:\windows\system32\drivers\etc\hosts (I think that's where it is) a line like:

    192.168.1.191    smc

Then add to apache:

    <VirtualHost *:80>
            ServerName smc
            DocumentRoot /home/doug/codebase/smcman/www/4
        <Location /api>
            ProxyPass http://localhost:8001/api/
            ProxyPassReverse http://localhost:8001/api/
        </Location>
        <Location /socket.io>
            # Make sure you leave off the trailing slash.
            ProxyPass http://localhost:8001/socket.io
            ProxyPassReverse http://localhost:8001/socket.io
        </Location>
        <Location /view>
            ProxyPass http://localhost:8001/view/
            ProxyPassReverse http://localhost:8001/view/
        </Location>
    </VirtualHost>

    <Directory /home/doug/codebase/smcman/www/>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
