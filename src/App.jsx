import React, { useEffect, useState } from "react";
import axios from "axios";
import { generateRandomString, generateCodeChallenge } from "./pkce";

import { Paper, Button, Typography, Box, CircularProgress } from "@mui/material";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID_KEY;
const redirectUri = import.meta.env.VITE_REDIRECT_URL;
const scopes = ["user-read-playback-state", "user-read-currently-playing"];

export default function App() {
    const [token, setToken] = useState(null);
    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const storedVerifier = localStorage.getItem("verifier");

        if (code && storedVerifier && !token) {
            setLoading(true);
            const body = new URLSearchParams({
                client_id: clientId,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                code_verifier: storedVerifier,
            });

            axios
                .post("https://accounts.spotify.com/api/token", body.toString(), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                })
                .then((response) => {
                    setToken(response.data.access_token);
                    localStorage.removeItem("verifier");
                    window.history.replaceState({}, document.title, "/");
                })
                .catch((err) => {
                    console.error("Token exchange error", err.response?.data || err.message);
                })
                .finally(() => setLoading(false));
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        async function fetchTrack() {
            try {
                const response = await axios.get(
                    "https://api.spotify.com/v1/me/player/currently-playing",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setTrack(response.data);
            } catch (error) {
                console.error("Fetch track error", error.response?.data || error.message);
            }
        }

        fetchTrack();
        const interval = setInterval(fetchTrack, 5000);
        return () => clearInterval(interval);
    }, [token]);

    async function login() {
        const verifier = generateRandomString(128);
        const challenge = await generateCodeChallenge(verifier);

        localStorage.setItem("verifier", verifier);

        const params = new URLSearchParams({
            client_id: clientId,
            response_type: "code",
            redirect_uri: redirectUri,
            scope: scopes.join(" "),
            code_challenge_method: "S256",
            code_challenge: challenge,
        });

        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#121212",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    maxWidth: 360,
                    width: "100%",
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "#1DB954",
                    color: "white",
                    textAlign: "center",
                }}
            >
                {!token ? (
                    <Button
                        variant="contained"
                        sx={{ bgcolor: "white", color: "#1DB954", fontWeight: "bold" }}
                        onClick={login}
                    >
                        Login with Spotify
                    </Button>
                ) : loading ? (
                    <CircularProgress color="inherit" />
                ) : track && track.item ? (
                    <Box>
                        <img
                            src={track.item.album.images[0].url}
                            alt="Album art"
                            width="100%"
                            style={{ borderRadius: 8, marginBottom: 16 }}
                        />
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {track.item.name}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            {track.item.artists.map((artist) => artist.name).join(", ")}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {track.is_playing ? "▶️ Playing" : "⏸️ Paused"}
                        </Typography>
                    </Box>
                ) : (
                    <Typography>No song currently playing.</Typography>
                )}
            </Paper>
        </Box>
    );
}
