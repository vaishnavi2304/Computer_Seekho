package com.example.entities;



import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "course")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "course_category", nullable = false, length = 50)
    private String courseCategory;

    @Column(name = "course_name", nullable = false, length = 100)
    private String courseName;

    @Column(name = "course_description", columnDefinition = "TEXT")
    private String courseDescription;

    @Column(name = "course_duration")
    private Integer courseDuration;

    @Column(name = "course_fees", precision = 10, scale = 2)
    private BigDecimal courseFees;

    @Column(name = "course_fees_from")
    private LocalDate courseFeesFrom;

    @Column(name = "course_fees_to")
    private LocalDate courseFeesTo;

    @Column(name = "course_syllabus", columnDefinition = "TEXT")
    private String courseSyllabus;

    @Column(name = "age_grp_type", length = 50)
    private String ageGrpType;

    @Column(name = "course_is_active")
    private Boolean courseIsActive = true;

    /*
     * cover_photo
     * Was VARCHAR(255) (JPA default when no length given) - widened to
     * LONGTEXT so this can hold either a short hosted image URL (unchanged,
     * existing behaviour) OR a base64 data: URL from the admin
     * "Browse..." file picker.
     */
    @Column(name = "cover_photo", columnDefinition = "LONGTEXT")
    private String coverPhoto;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Batch> batches;

    public Course() {}

    public Course(Integer courseId, String courseCategory, String courseName, String courseDescription,
                  Integer courseDuration, BigDecimal courseFees, LocalDate courseFeesFrom, 
                  LocalDate courseFeesTo, String courseSyllabus, String ageGrpType, 
                  Boolean courseIsActive, String coverPhoto, Boolean isFeatured, List<Batch> batches) {
        this.courseId = courseId;
        this.courseCategory = courseCategory;
        this.courseName = courseName;
        this.courseDescription = courseDescription;
        this.courseDuration = courseDuration;
        this.courseFees = courseFees;
        this.courseFeesFrom = courseFeesFrom;
        this.courseFeesTo = courseFeesTo;
        this.courseSyllabus = courseSyllabus;
        this.ageGrpType = ageGrpType;
        this.courseIsActive = courseIsActive;
        this.coverPhoto = coverPhoto;
        this.isFeatured = isFeatured;
        this.batches = batches;
    }

    public Integer getCourseId() { return courseId; }
    public void setCourseId(Integer courseId) { this.courseId = courseId; }

    public String getCourseCategory() { return courseCategory; }
    public void setCourseCategory(String courseCategory) { this.courseCategory = courseCategory; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getCourseDescription() { return courseDescription; }
    public void setCourseDescription(String courseDescription) { this.courseDescription = courseDescription; }

    public Integer getCourseDuration() { return courseDuration; }
    public void setCourseDuration(Integer courseDuration) { this.courseDuration = courseDuration; }

    public BigDecimal getCourseFees() { return courseFees; }
    public void setCourseFees(BigDecimal courseFees) { this.courseFees = courseFees; }

    public LocalDate getCourseFeesFrom() { return courseFeesFrom; }
    public void setCourseFeesFrom(LocalDate courseFeesFrom) { this.courseFeesFrom = courseFeesFrom; }

    public LocalDate getCourseFeesTo() { return courseFeesTo; }
    public void setCourseFeesTo(LocalDate courseFeesTo) { this.courseFeesTo = courseFeesTo; }

    public String getCourseSyllabus() { return courseSyllabus; }
    public void setCourseSyllabus(String courseSyllabus) { this.courseSyllabus = courseSyllabus; }

    public String getAgeGrpType() { return ageGrpType; }
    public void setAgeGrpType(String ageGrpType) { this.ageGrpType = ageGrpType; }

    public Boolean getCourseIsActive() { return courseIsActive; }
    public void setCourseIsActive(Boolean courseIsActive) { this.courseIsActive = courseIsActive; }

    public String getCoverPhoto() { return coverPhoto; }
    public void setCoverPhoto(String coverPhoto) { this.coverPhoto = coverPhoto; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }

    public List<Batch> getBatches() { return batches; }
    public void setBatches(List<Batch> batches) { this.batches = batches; }
}