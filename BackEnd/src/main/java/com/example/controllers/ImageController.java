package com.example.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.dto.ImageRequest;
import com.example.dto.ImageResponse;
import com.example.services.ImageService;

@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    private ImageService imageService;

    // GET ALL IMAGES
    @GetMapping
    public List<ImageResponse> getAllImages() {
        return imageService.getAllImages();
    }

    // GET IMAGE BY ID
    @GetMapping("/{id}")
    public ImageResponse getImageById(@PathVariable("id") int id) {
        return imageService.getImageById(id);
    }

    // SAVE IMAGE
    @PostMapping
    public ImageResponse saveImage(@RequestBody ImageRequest imageRequest) {
        return imageService.saveImage(imageRequest);
    }

    // UPDATE IMAGE
    @PutMapping("/{id}")
    public ImageResponse updateImage(
            @PathVariable("id") int id,
            @RequestBody ImageRequest imageRequest) {

        return imageService.updateImage(id, imageRequest);
    }

    // DELETE IMAGE
    @DeleteMapping("/{id}")
    public String deleteImage(@PathVariable("id") int id) {
        imageService.deleteImage(id);
        return "Image deleted successfully.";
    }
}