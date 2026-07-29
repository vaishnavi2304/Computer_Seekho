package com.example.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.dto.ContactRequest;
import com.example.dto.ContactResponse;
import com.example.services.ContactService;

@RestController
@RequestMapping("/contacts")
public class ContactController {

    @Autowired
    private ContactService contactService;

    // Get all contacts
    @GetMapping
    public List<ContactResponse> getAllContacts() {
        return contactService.getAllContacts();
    }

    // Get contact by ID
    @GetMapping("/{id}")
    public ContactResponse getContactById(@PathVariable("id") int id) {
        return contactService.getContactById(id);
    }

    // Save a new contact
    @PostMapping
    public ContactResponse saveContact(@RequestBody ContactRequest contactRequest) {
        return contactService.saveContact(contactRequest);
    }

    // Update an existing contact
    @PutMapping("/{id}")
    public ContactResponse updateContact(@PathVariable("id") int id,
                                         @RequestBody ContactRequest contactRequest) {
        return contactService.updateContact(id, contactRequest);
    }

    // Delete a contact
    @DeleteMapping("/{id}")
    public String deleteContact(@PathVariable("id") int id) {
        contactService.deleteContact(id);
        return "Contact deleted successfully.";
    }
}