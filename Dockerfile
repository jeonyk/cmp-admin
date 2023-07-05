FROM nginx
EXPOSE 80
COPY default.conf /etc/nginx/conf.d/default.conf
COPY web-adm-p /usr/share/nginx/html
#FROM httpd
#EXPOSE 80
#COPY web-adm-p /var/www/web-adm-p
