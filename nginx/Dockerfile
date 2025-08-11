FROM nginx:alpine

# Install certbot for Let's Encrypt SSL
RUN apk add --no-cache certbot certbot-nginx

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-custom && \
    adduser -S nginx-custom -u 1001

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/ssl && \
    chown -R nginx-custom:nginx-custom /var/cache/nginx /var/log/nginx /etc/nginx/ssl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80 443

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]