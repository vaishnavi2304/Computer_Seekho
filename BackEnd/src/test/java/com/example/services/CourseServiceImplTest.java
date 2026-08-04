package com.example.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.dto.CourseResponse;
import com.example.entities.Course;
import com.example.repositories.CourseRepository;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    /*
     * Mockito creates a fake CourseRepository.
     * It does not connect to MySQL.
     */
    @Mock
    private CourseRepository courseRepository;

    /*
     * Mockito creates the real CourseServiceImpl
     * and puts the fake repository inside it.
     */
    @InjectMocks
    private CourseServiceImpl courseService;

    @Test
    void getCourseById_shouldReturnCourse_whenCourseExists() {

        // -------------------------------
        // 1. ARRANGE: Prepare fake data
        // -------------------------------

        Course course = new Course();

        course.setCourseId(5);
        course.setCourseCategory("CERTIFICATION");
        course.setCourseName("Java Programming");
        course.setCourseFees(
                new BigDecimal("25000.00")
        );
        course.setCourseIsActive(true);
        course.setIsFeatured(false);

        /*
         * Tell Mockito:
         * when findById(5) is called,
         * return this fake course.
         */
        when(courseRepository.findById(5))
                .thenReturn(Optional.of(course));

        // -------------------------------
        // 2. ACT: Call actual service
        // -------------------------------

        CourseResponse response =
                courseService.getCourseById(5);

        // -------------------------------
        // 3. ASSERT: Check result
        // -------------------------------

        assertEquals(
                5,
                response.getCourseId()
        );

        assertEquals(
                "Java Programming",
                response.getCourseName()
        );

        assertEquals(
                new BigDecimal("25000.00"),
                response.getCourseFees()
        );

        /*
         * Verify that repository.findById(5)
         * was called once.
         */
        verify(courseRepository)
                .findById(5);
    }

    @Test
    void getCourseById_shouldThrowException_whenCourseDoesNotExist() {

        // -------------------------------
        // 1. ARRANGE
        // -------------------------------

        /*
         * Tell Mockito:
         * no course exists for ID 999.
         */
        when(courseRepository.findById(999))
                .thenReturn(Optional.empty());

        // -------------------------------
        // 2. ACT + ASSERT
        // -------------------------------

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () -> courseService
                                .getCourseById(999)
                );

        assertEquals(
                "Course not found with id: 999",
                exception.getMessage()
        );

        verify(courseRepository)
                .findById(999);
    }
}