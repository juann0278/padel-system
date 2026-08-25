package com.padel.turnero.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio donde se almacenarán los archivos.", ex);
        }
    }

    public String guardarArchivo(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("No se puede guardar un archivo vacío.");
        }

        try {
            // Limpiar nombre y generar uno único para evitar colisiones
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID().toString() + extension;

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName; // Retornamos el nombre del archivo guardado
        } catch (IOException ex) {
            throw new RuntimeException("Error al almacenar el archivo. Intente nuevamente.", ex);
        }
    }
}