FROM alpine:3.21 AS build

RUN apk add --no-cache bash esbuild pandoc

WORKDIR /app
COPY engine/ engine/
COPY src/ src/
COPY templates/ templates/
COPY build.sh .

RUN bash build.sh

FROM nginx:alpine

COPY nginx/decks-container.conf /etc/nginx/conf.d/default.conf
COPY nginx/htpasswd.d/ /etc/nginx/htpasswd.d/
COPY --from=build /app/public /usr/share/nginx/html
