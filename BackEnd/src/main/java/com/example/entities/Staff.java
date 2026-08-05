// Staff.java
package com.example.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Integer staffId;

    @Column(name = "staff_name", length = 100)
    private String staffName;

    /*
     * photo_url
     * Was VARCHAR(255) - widened to LONGTEXT so this can hold either a
     * short hosted image URL (unchanged, existing behaviour) OR a
     * base64 data: URL from the admin "Browse..." file picker.
     */
    @Column(name = "photo_url", columnDefinition = "LONGTEXT")
    private String photoUrl;

    @Column(name = "staff_mobile")
    private Long staffMobile;

    @Column(name = "staff_email", length = 100)
    private String staffEmail;

    @Column(name = "staff_username", unique = true, length = 100)
    private String staffUsername;

    // @JsonIgnore: never send the password hash back to the browser in
    // any API response (staff lists, enquiry.staff, followup.staff, etc.)
    @JsonIgnore
    @Column(name = "staff_password")
    private String staffPassword;

    @Column(name = "staff_role", length = 50)
    private String staffRole;
    
    @Column(name = "description", length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserRole userRole;

    public Staff() {
    }

    public Staff(String staffName, String photoUrl, Long staffMobile,
                 String staffEmail, String staffUsername,
                 String staffPassword, String staffRole,
                 UserRole userRole) {
        this.staffName = staffName;
        this.photoUrl = photoUrl;
        this.staffMobile = staffMobile;
        this.staffEmail = staffEmail;
        this.staffUsername = staffUsername;
        this.staffPassword = staffPassword;
        this.staffRole = staffRole;
        this.userRole = userRole;
    }

    public Integer getStaffId() {
        return staffId;
    }

    public void setStaffId(Integer staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Long getStaffMobile() {
        return staffMobile;
    }

    public void setStaffMobile(Long staffMobile) {
        this.staffMobile = staffMobile;
    }

    public String getStaffEmail() {
        return staffEmail;
    }

    public void setStaffEmail(String staffEmail) {
        this.staffEmail = staffEmail;
    }

    public String getStaffUsername() {
        return staffUsername;
    }

    public void setStaffUsername(String staffUsername) {
        this.staffUsername = staffUsername;
    }

    public String getStaffPassword() {
        return staffPassword;
    }

    public void setStaffPassword(String staffPassword) {
        this.staffPassword = staffPassword;
    }

    public String getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(String staffRole) {
        this.staffRole = staffRole;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }
}