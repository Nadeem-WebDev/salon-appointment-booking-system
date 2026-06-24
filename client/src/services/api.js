import axios from 'axios';
API_BASE = import.meta.env.MODE === "development" ?  process.env.VITE_API_BASE : "/api";


export const api = axios.create({ baseURL: API_BASE });
