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

import com.example.dto.AlbumDTO;

import com.example.services.AlbumService;

@RestController
@RequestMapping("/albums")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    @GetMapping
    public List<AlbumDTO> getAllAlbums() {
        return albumService.getAllAlbums();
    }

  
    
    @GetMapping("/{id}")
    public AlbumDTO getAlbumById(@PathVariable("id") int id) {
        return albumService.getAlbumById(id);
    }

    @PostMapping
    public AlbumDTO saveAlbum(@RequestBody AlbumDTO albumRequest) {
        return albumService.saveAlbum(albumRequest);
    }

    @PutMapping("/{id}")
    public AlbumDTO updateAlbum(@PathVariable("id") int id,
                                @RequestBody AlbumDTO albumRequest) {
        return albumService.updateAlbum(id, albumRequest);
    }

    @DeleteMapping("/{id}")
    public String deleteAlbum(@PathVariable("id") int id) {
        albumService.deleteAlbum(id);
        return "Album deleted successfully.";
    }
}