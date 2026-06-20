FROM node:20

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias Node
RUN npm install

# Copiar todo el proyecto
COPY . .

# Descargar yt-dlp correctamente
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Crear carpeta temporal
RUN mkdir -p /tmp

# Ejecutar bot
CMD ["npm", "start"]
