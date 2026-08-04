package com.example.services;


import com.example.dto.CourseRequest;
import com.example.dto.CourseResponse;
import com.example.entities.Course;
import com.example.repositories.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseServiceImpl implements CourseService {
	
	private static final Logger log =
	        LoggerFactory.getLogger(CourseServiceImpl.class);

    @Autowired
    private CourseRepository courseRepository;

    @Override
    public CourseResponse createCourse(CourseRequest request) {

        log.info(
                "Creating course with name={}",
                request.getCourseName()
        );

        if (courseRepository.existsByCourseNameIgnoreCase(
                request.getCourseName())) {

            log.warn(
                    "Duplicate course creation attempted. courseName={}",
                    request.getCourseName()
            );

            throw new RuntimeException(
                    "A course named \"" +
                    request.getCourseName() +
                    "\" already exists. " +
                    "Use the existing course instead of creating a duplicate."
            );
        }

        Course course = mapToEntity(request);

        Course savedCourse =
                courseRepository.save(course);

        log.info(
                "Course created successfully. courseId={} courseName={}",
                savedCourse.getCourseId(),
                savedCourse.getCourseName()
        );

        return mapToResponse(savedCourse);
    }

    @Override
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CourseResponse getCourseById(Integer id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        return mapToResponse(course);
    }

    @Override
    public CourseResponse updateCourse(Integer id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

       // course.setCourseCategory(request.getCourseCategory());
        course.setCourseName(request.getCourseName());
        course.setCourseDescription(request.getCourseDescription());
        course.setCourseDuration(request.getCourseDuration());
        course.setCourseFees(request.getCourseFees());
        course.setCourseFeesFrom(request.getCourseFeesFrom());
        course.setCourseFeesTo(request.getCourseFeesTo());
        course.setCourseSyllabus(request.getCourseSyllabus());
        course.setAgeGrpType(request.getAgeGrpType());
        if (request.getCourseIsActive() != null) course.setCourseIsActive(request.getCourseIsActive());
        course.setCoverPhoto(request.getCoverPhoto());
        if (request.getIsFeatured() != null) course.setIsFeatured(request.getIsFeatured());

        Course updatedCourse = courseRepository.save(course);
        return mapToResponse(updatedCourse);
    }

    @Override
    public CourseResponse updateCourseStatus(Integer id, Boolean status) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        course.setCourseIsActive(status);
        Course updatedCourse = courseRepository.save(course);
        return mapToResponse(updatedCourse);
    }

    @Override
    public List<CourseResponse> getActiveCourses() {
        return courseRepository.findByCourseIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseResponse> searchCourses(String keyword) {
        return courseRepository.findByCourseNameContainingIgnoreCaseOrCourseCategoryContainingIgnoreCase(keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Course mapToEntity(CourseRequest request) {
        Course course = new Course();
        course.setCourseCategory(request.getCourseCategory());
        course.setCourseName(request.getCourseName());
        course.setCourseDescription(request.getCourseDescription());
        course.setCourseDuration(request.getCourseDuration());
        course.setCourseFees(request.getCourseFees());
        course.setCourseFeesFrom(request.getCourseFeesFrom());
        course.setCourseFeesTo(request.getCourseFeesTo());
        course.setCourseSyllabus(request.getCourseSyllabus());
        course.setAgeGrpType(request.getAgeGrpType());
        course.setCourseIsActive(request.getCourseIsActive() != null ? request.getCourseIsActive() : true);
        course.setCoverPhoto(request.getCoverPhoto());
        course.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        return course;
    }

    private CourseResponse mapToResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setCourseId(course.getCourseId());
        response.setCourseCategory(course.getCourseCategory());
        response.setCourseName(course.getCourseName());
        response.setCourseDescription(course.getCourseDescription());
        response.setCourseDuration(course.getCourseDuration());
        response.setCourseFees(course.getCourseFees());
        response.setCourseFeesFrom(course.getCourseFeesFrom());
        response.setCourseFeesTo(course.getCourseFeesTo());
        response.setCourseSyllabus(course.getCourseSyllabus());
        response.setAgeGrpType(course.getAgeGrpType());
        response.setCourseIsActive(course.getCourseIsActive());
        response.setCoverPhoto(course.getCoverPhoto());
        response.setIsFeatured(course.getIsFeatured());
        return response;
    }
}