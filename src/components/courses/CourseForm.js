"use client";

import { useEffect } from "react";

import {
    Grid,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Stack,
    InputAdornment,
    MenuItem,
} from "@mui/material";

import {
    useForm,
    Controller,
} from "react-hook-form";

import {
    createCourse,
    updateCourse,
} from "@/services/courses";

import {
    successToast,
    errorToast,
} from "@/lib/toast";

export default function CourseForm({
    defaultValues,
    onSuccess,
    onCancel,
    isEditing = true,
}) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            name: "",
            code_prefix: "",
            is_active: true,
            default_fee: "",
            duration_value: "",
            duration_unit: "MONTHS",
        },
    });

    useEffect(() => {
        if (!defaultValues) return;

        reset({
            name: defaultValues.name || "",
            code_prefix: defaultValues.code_prefix || "",
            is_active: defaultValues.is_active ?? true,
            default_fee: defaultValues.default_fee ?? "",
            duration_value: defaultValues.duration_value ?? "",
            duration_unit: defaultValues.duration_unit || "MONTHS",
        });
    }, [defaultValues, reset]);

    async function onSubmit(values) {
        try {
            const payload = {
                ...values,
                code_prefix: values.code_prefix.toUpperCase().trim(),
                duration_value: values.duration_value !== "" && values.duration_value !== null ? Number(values.duration_value) : 0,
                duration_unit: values.duration_unit || "MONTHS",
            };

            if (defaultValues?.id) {
                await updateCourse(defaultValues.id, payload);
                successToast("Course updated successfully.");
            } else {
                await createCourse(payload);
                successToast("Course created successfully.");
            }

            onSuccess?.();
        } catch (error) {
            errorToast(error, "Unable to save course.");
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>

                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Course Name"
                                fullWidth
                                required
                                disabled={!isEditing}
                                slotProps={{
                                    input: {
                                        style: {
                                            opacity: isEditing ? 1 : 0.8,
                                        },
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="code_prefix"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Code Prefix"
                                fullWidth
                                required
                                disabled={!isEditing}
                                slotProps={{
                                    input: {
                                        style: {
                                            opacity: isEditing ? 1 : 0.8,
                                        },
                                    },
                                    htmlInput: {
                                        maxLength: 10,
                                        style: {
                                            textTransform: "uppercase",
                                        },
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="default_fee"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Default Course Fee"
                                type="number"
                                fullWidth
                                required
                                disabled={!isEditing}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                                        style: { opacity: isEditing ? 1 : 0.8 },
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={1}>
                        <Controller
                            name="duration_value"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Duration"
                                    type="number"
                                    fullWidth
                                    placeholder="e.g. 6"
                                    disabled={!isEditing}
                                    slotProps={{
                                        input: {
                                            style: { opacity: isEditing ? 1 : 0.8 },
                                        },
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="duration_unit"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Unit"
                                    sx={{ minWidth: 120 }}
                                    disabled={!isEditing}
                                >
                                    <MenuItem value="MONTHS">Months</MenuItem>
                                    <MenuItem value="WEEKS">Weeks</MenuItem>
                                </TextField>
                            )}
                        />
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                label="Active Course"
                                disabled={!isEditing}
                                control={
                                    <Switch
                                        checked={field.value}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.checked
                                            )
                                        }
                                        disabled={!isEditing}
                                    />
                                }
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            justifyContent: "flex-end",
                            mt: 2,
                        }}
                    >
                        <Button onClick={onCancel}>
                            {isEditing ? "Cancel" : "Close"}
                        </Button>

                        {isEditing && (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                {defaultValues?.id
                                    ? "Update Course"
                                    : "Create Course"}
                            </Button>
                        )}
                    </Stack>
                </Grid>

            </Grid>
        </form>
    );
}