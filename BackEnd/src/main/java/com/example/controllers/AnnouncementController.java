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

import com.example.dto.AnnouncementRequest;
import com.example.dto.AnnouncementResponse;
import com.example.services.AnnouncementService;

@RestController
@RequestMapping("/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    public List<AnnouncementResponse> getAllAnnouncements() {
        return announcementService.getAllAnnouncements();
    }

    @GetMapping("/{id}")
    public AnnouncementResponse getAnnouncementById(@PathVariable("id") int id) {
        return announcementService.getAnnouncementById(id);
    }

    @PostMapping
    public AnnouncementResponse saveAnnouncement(
            @RequestBody AnnouncementRequest announcementRequest) {

        return announcementService.saveAnnouncement(announcementRequest);
    }

    @PutMapping("/{id}")
    public AnnouncementResponse updateAnnouncement(
            @PathVariable("id") int id,
            @RequestBody AnnouncementRequest announcementRequest) {

        return announcementService.updateAnnouncement(id, announcementRequest);
    }
    
    @DeleteMapping("/{id}")
    public String deleteAnnouncement(@PathVariable("id") int id) {
        announcementService.deleteAnnouncement(id);
        return "Announcement deleted successfully.";
    }
}