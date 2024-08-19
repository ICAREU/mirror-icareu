import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	Container,
	Divider,
	Typography,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	FormLabel,
	TextField,
	Button,
	Box,
	Grid,
} from "@mui/material";
import { getCurrentShift, calculateAge } from "../../utils/helper";
import SearchFilterBar from "../SearchFilterBar";
import { useSearch } from "../../hooks/useSearch";
import { usePatients } from "../../context/patientContext";
import { usePatientRecords } from "../../context/patientRecordContext";

const VITAL_SIGNS = [
	{
		label: "อุณหภูมิ (BT)",
		name: "BT",
		options: ["ไม่มีไข้", "ไข้ต่ำ", "ไข้สูง"],
	},
	{ label: "ความดันโลหิต (BP)", name: "BP", options: ["ปกติ", "ต่ำ", "สูง"] },
	{
		label: "อัตราการเต้นของหัวใจ (HR)",
		name: "HR",
		options: ["ปกติ", "ช้า", "เร็ว"],
	},
	{ label: "อัตราการหายใจ (RR)", name: "RR", options: ["ปกติ", "ช้า", "เร็ว"] },
	{
		label: "ค่าออกซิเจนในเลือด (O2sat)",
		name: "O2sat",
		options: ["ปกติ", "ต่ำ"],
	},
];

const CONSCIOUS_OPTIONS = [
	"ตื่น รู้สึกตัวดี",
	"หลับ",
	"ซึม",
	"สับสน",
	"ไม่รู้สึกตัว",
];
const BREATH_PATTERN_OPTIONS = [
	"หายใจปกติ",
	"หายใจช้า",
	"หายใจเร็ว หายใจหอบเหนื่อย",
];
const EAT_METHOD_OPTIONS = ["รับประทานเองได้", "ใส่สายยางให้อาหาร"];
const FOOD_TYPE_OPTIONS = ["นมแม่", "นมผสม", "อาหารแข็ง", "อาหารอื่นๆ"];
const EXTRA_FOOD_OPTIONS = ["ตามปกติ", "รับประทานน้อย", "ไม่รับประทาน"];

const initialFormState = {
	BT: "ไม่มีไข้",
	BP: "ปกติ",
	HR: "ปกติ",
	RR: "ปกติ",
	O2sat: "ปกติ",
	conscious: "ตื่น รู้สึกตัวดี",
	breath_pattern: "หายใจปกติ",
	eat_method: "รับประทานเองได้",
	food_type: "นมแม่",
	food_intake: [""],
	sleep: "",
	excretion: "",
	extra_symptoms: "",
	extra_food: "ตามปกติ",
	notes: "",
	shift: "",
};

const Form = () => {
	const currentDate = new Date().toLocaleDateString();
	const [formHeader, setFormHeader] = useState({
		HN: "",
		name_surname: "",
		sex: "",
		age: "",
	});
	const [form, setForm] = useState(initialFormState);

	const { patients } = usePatients();
	const {
		currentEditRecord,
		setCurrentEditRecord,
		useFetchRecords,
		addRecord,
		updateRecord,
	} = usePatientRecords();

	const { data: records = [] } = useFetchRecords(currentEditRecord.HN);

	const generateLabel = useCallback(
		(item) => `${item.name} ${item.surname} (${item.HN})`,
		[]
	);

	const patientOptions = useMemo(
		() =>
			patients.map((patient) => ({
				id: patient.id,
				label: generateLabel(patient),
			})),
		[patients, generateLabel]
	);

	const recordOptions = useMemo(
		() => [
			{ id: "create-new", label: "Create New Record" },
			...records.map((record) => ({ id: record.id, label: record.id })),
		],
		[records]
	);

	const {
		searchTerm: patientSearchTerm,
		setSearchTerm: setPatientSearchTerm,
		filteredItems: filteredPatients,
	} = useSearch(patientOptions, ["label"]);
	const {
		searchTerm: recordSearchTerm,
		setSearchTerm: setRecordSearchTerm,
		filteredItems: filteredRecords,
	} = useSearch(recordOptions, ["label"]);

	const handleSelectHNFilter = useCallback(
		(value) => {
			setCurrentEditRecord({ HN: value, docId: null });
			const selectedPatient = patients.find((patient) => patient.id === value);
			if (selectedPatient) {
				setFormHeader({
					HN: selectedPatient.HN,
					name_surname: `${selectedPatient.name} ${selectedPatient.surname}`,
					sex: selectedPatient.gender,
					age: calculateAge(selectedPatient.DOB),
				});
				setForm(initialFormState);
			}
		},
		[patients, setCurrentEditRecord]
	);

	const handleSelectRecordFilter = useCallback(
		(value) => {
			setCurrentEditRecord((prev) => ({ ...prev, docId: value }));
			const selectedRecord = records.find((record) => record.id === value);
			if (selectedRecord) {
				setForm((prev) => ({
					...prev,
					...selectedRecord,
					food_intake: selectedRecord.food_intake || [""],
				}));
			} else {
				setForm(initialFormState);
			}
		},
		[records, setCurrentEditRecord]
	);

	const handleFormChange = useCallback((e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	}, []);

	useEffect(() => {
		setForm((prev) => ({ ...prev, shift: getCurrentShift() }));
	}, []);

	const handleSubmit = useCallback(
		(event) => {
			event.preventDefault();

			const recordData = {
				HN: formHeader.HN,
				record: {
					...form,
					id: currentEditRecord.docId,
				},
			};

			if (currentEditRecord.docId && currentEditRecord.docId != "create-new") {
				updateRecord(recordData);
			} else {
				addRecord(recordData);
			}
		},
		[form, formHeader.HN, currentEditRecord.docId, addRecord, updateRecord]
	);

	const renderRadioGroup = useCallback(
		({ label, name, value, options }) => (
			<Grid item xs={12} sm={6} key={name}>
				<FormControl component="fieldset">
					<FormLabel component="legend" required>
						{label}
					</FormLabel>
					<RadioGroup
						row
						aria-label={name}
						name={name}
						value={value}
						onChange={handleFormChange}
					>
						{options.map((option) => (
							<FormControlLabel
								key={option}
								value={option}
								control={<Radio />}
								label={option}
							/>
						))}
					</RadioGroup>
				</FormControl>
			</Grid>
		),
		[handleFormChange]
	);

	return (
		<Container maxWidth="md">
			<Typography variant="h4" gutterBottom>
				บันทึกอาการรายวัน ประจำวันที่ {currentDate}
			</Typography>

			<form onSubmit={handleSubmit}>
				<SearchFilterBar
					searchTerm={patientSearchTerm}
					setSearchTerm={setPatientSearchTerm}
					filterItems={filteredPatients}
					onFilterSelected={handleSelectHNFilter}
				/>

				<Grid container spacing={2} margin="normal">
					{Object.entries(formHeader).map(([key, value]) => (
						<Grid item xs={12} sm={6} key={key}>
							<TextField
								label={key}
								value={value}
								InputProps={{ readOnly: true }}
								fullWidth
							/>
						</Grid>
					))}
				</Grid>

				<SearchFilterBar
					searchTerm={recordSearchTerm}
					setSearchTerm={setRecordSearchTerm}
					filterItems={filteredRecords}
					onFilterSelected={handleSelectRecordFilter}
				/>

				<FormControl component="fieldset" margin="normal">
					<FormLabel component="legend" required>
						เวร
					</FormLabel>
					<RadioGroup
						row
						aria-label="shift"
						name="shift"
						value={form.shift}
						onChange={handleFormChange}
					>
						{[
							{ value: "morning-shift", label: "เวรเช้า (08:00 - 16:00)" },
							{ value: "afternoon-shift", label: "เวรบ่าย (16:00 - 23:59)" },
							{ value: "night-shift", label: "เวรดึก (00:00 - 08:00)" },
						].map(({ value, label }) => (
							<FormControlLabel
								key={value}
								value={value}
								control={<Radio />}
								label={label}
							/>
						))}
					</RadioGroup>
				</FormControl>

				<Divider sx={{ marginY: "3rem" }} />

				<Typography variant="h5" gutterBottom>
					ส่วนที่ 1 สัญญาณชีพ
				</Typography>
				<Grid container spacing={2} marginBottom={2}>
					{VITAL_SIGNS.map((vitalSign) =>
						renderRadioGroup({ ...vitalSign, value: form[vitalSign.name] })
					)}
				</Grid>

				<Divider sx={{ marginY: "3rem" }} />

				<Typography variant="h5" gutterBottom>
					ส่วนที่ 2 อาการเบื้องต้น
				</Typography>
				<Grid container spacing={2} marginBottom={2}>
					{renderRadioGroup({
						label: "ระดับความรู้สึกตัว",
						name: "conscious",
						value: form.conscious,
						options: CONSCIOUS_OPTIONS,
					})}
					{renderRadioGroup({
						label: "ลักษณะการหายใจ",
						name: "breath_pattern",
						value: form.breath_pattern,
						options: BREATH_PATTERN_OPTIONS,
					})}
					<Grid item xs={12}>
						<TextField
							name="extra_symptoms"
							label="อาการเพิ่มเติม"
							value={form.extra_symptoms}
							placeholder="พิมพ์อาการเพิ่มเติมที่นี่"
							fullWidth
							onChange={handleFormChange}
						/>
					</Grid>
				</Grid>

				<Typography variant="h6" gutterBottom>
					การรับประทานอาหาร
				</Typography>
				<Grid container spacing={2} marginBottom={2}>
					{renderRadioGroup({
						label: "รูปแบบการรับประทานอาหาร",
						name: "eat_method",
						value: form.eat_method,
						options: EAT_METHOD_OPTIONS,
					})}
					{renderRadioGroup({
						label: "อาหาร",
						name: "food_type",
						value: form.food_type,
						options: FOOD_TYPE_OPTIONS,
					})}
					{renderRadioGroup({
						label: "พฤติกรรมการรับประทานอาหาร",
						name: "extra_food",
						value: form.extra_food,
						options: EXTRA_FOOD_OPTIONS,
					})}
					<Grid item xs={12}>
						<TextField
							label="การนอนหลับ"
							name="sleep"
							value={form.sleep}
							placeholder="พิมพ์การนอนหลับที่นี่"
							fullWidth
							onChange={handleFormChange}
						/>
					</Grid>
				</Grid>

				<Typography variant="h6" gutterBottom>
					หมายเหตุเพิ่มเติม
				</Typography>
				<TextField
					placeholder="พิมพ์หมายเหตุเพิ่มเติมที่นี่"
					name="notes"
					value={form.notes}
					multiline
					rows={4}
					fullWidth
					margin="normal"
					onChange={handleFormChange}
				/>

				<Box marginTop={2}>
					<Button type="submit" variant="contained" color="primary">
						บันทึกข้อมูล
					</Button>
				</Box>
			</form>
		</Container>
	);
};

export default Form;
