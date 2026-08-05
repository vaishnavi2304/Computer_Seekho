package com.example.controllers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.dto.ExcelImportResponse;
import com.example.dto.ExcelValidationResponse;
import com.example.services.ExcelUploadService;
@RestController
@RequestMapping("/api/excel")
@CrossOrigin("*")
public class ExcelUploadController {
    @Autowired
    private ExcelUploadService excelUploadService;
    @PostMapping(
            value = "/validate",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExcelValidationResponse>
    validateExcel(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(
                excelUploadService.validateExcel(file));
    }
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExcelImportResponse>
    uploadExcel(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(
                excelUploadService.uploadExcel(file));
    }

    @PostMapping(
            value = "/recruiters/validate",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExcelValidationResponse>
    validateRecruiterExcel(
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(
                excelUploadService.validateRecruiterExcel(file));
    }

    @PostMapping(
            value = "/recruiters/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExcelImportResponse>
    uploadRecruiterExcel(
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(
                excelUploadService.uploadRecruiterExcel(file));
    }

}