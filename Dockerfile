FROM node:18-alpine

WORKDIR /app

# 패키지 설치 (캐시 최적화를 위해 package.json만 먼저 복사)
COPY package.json package-lock.json* ./
RUN npm install

# 나머지 소스 복사
COPY . .

# Next.js 개발 서버가 컨테이너 외부에서 접속 가능하도록 hostname 바인딩
ENV HOSTNAME "0.0.0.0"

EXPOSE 3000

CMD ["npm", "run", "dev"]
