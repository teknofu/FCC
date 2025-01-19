import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Family Chore Chart
          </Typography>
          <Typography variant="body1" paragraph>
            Organize and track household chores for the whole family. Make household management fun and rewarding!
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home;
