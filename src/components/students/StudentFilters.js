"use client";

import { Box, TextField, MenuItem, Button } from "@mui/material";
import { FilterAlt, Close } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getCourses } from "@/services/courses";

export default function StudentFilters({ onFilterChange, courses = [] }) {
    const [filters, setFilters] = useState({
        status: "",
        primaryCourse: "",
        industrialTraining: "",
    });
    const [allCourses, setAllCourses] = useState([]);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await getCourses();
            setAllCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load courses:", error);
        }
    };

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            status: "",
            primaryCourse: "",
            industrialTraining: "",
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== "");

    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
            <TextField
                select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                sx={{ minWidth: 150 }}
                size="small"
            >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="GRADUATED">Graduated</MenuItem>
                <MenuItem value="WITHDRAWN">Withdrawn</MenuItem>
            </TextField>

            <TextField
                select
                label="Primary Course"
                value={filters.primaryCourse}
                onChange={(e) => handleFilterChange("primaryCourse", e.target.value)}
                sx={{ minWidth: 180 }}
                size="small"
            >
                <MenuItem value="">All Courses</MenuItem>
                {allCourses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                        {course.name}
                    </MenuItem>
                ))}
            </TextField>

            <TextField
                select
                label="Industrial Training"
                value={filters.industrialTraining}
                onChange={(e) => handleFilterChange("industrialTraining", e.target.value)}
                sx={{ minWidth: 150 }}
                size="small"
            >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
            </TextField>

            {hasActiveFilters && (
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={handleReset}
                >
                    Clear Filters
                </Button>
            )}
        </Box>
    );
}
