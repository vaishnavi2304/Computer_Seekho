package com.example.services;

import org.springframework.web.multipart.MultipartFile;

import com.example.dto.ExcelImportResponse;
import com.example.dto.ExcelValidationResponse;

public interface ExcelUploadService {

    ExcelValidationResponse validateExcel(MultipartFile file);

    ExcelImportResponse uploadExcel(MultipartFile file);

    ExcelValidationResponse validateRecruiterExcel(MultipartFile file);

    ExcelImportResponse uploadRecruiterExcel(MultipartFile file);

}