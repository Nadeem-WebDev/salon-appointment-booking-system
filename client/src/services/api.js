import axios from 'axios';
API_BASE = process.env.API_BASE;


export const api = axios.create({ baseURL: API_BASE });
