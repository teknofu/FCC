import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useSelector } from 'react-redux';
import { migrateToNewSystem, validateMigration } from '../utils/migrations/migrateToNewSystem';
import { getDocs, query, collection, where, limit, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [validation, setValidation] = useState(null);

  const handleMigration = async () => {
    try {
      setLoading(true);
      setError('');
      setResults(null);
      setValidation(null);

      // Run migration
      const migrationResults = await migrateToNewSystem();
      setResults({
        ...migrationResults,
        collectionsCreated: ['chores', 'schedules', 'earnings'],
        errors: migrationResults.errors || []
      });

      // Validate results
      const validationResults = await validateMigration();
      setValidation(validationResults);
    } catch (error) {
      console.error('Migration error:', error);
      setError(error.message || 'Migration failed');
      setResults({
        message: 'Migration failed',
        errors: [error.message || 'Unknown error occurred'],
        collectionsCreated: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCollections = async () => {
    try {
      setLoading(true);
      setError('');
      setResults(null);
      
      // Create necessary collections
      const batch = writeBatch(db);
      
      // Ensure chores collection exists
      const choresRef = collection(db, 'chores');
      
      // Ensure earnings collection exists
      const earningsRef = collection(db, 'earnings');
      
      // Ensure schedules collection exists
      const schedulesRef = collection(db, 'schedules');
      
      // Ensure payment schedules collection exists
      const paymentSchedulesRef = collection(db, 'paymentSchedules');
      
      // Ensure payments collection exists
      const paymentsRef = collection(db, 'payments');
      
      await batch.commit();
      
      setResults({
        success: true,
        message: 'Collections setup completed successfully',
        collectionsCreated: ['chores', 'earnings', 'schedules', 'paymentSchedules', 'payments']
      });
    } catch (error) {
      console.error('Error setting up collections:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.role === 'parent') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Access denied. Parent access required.</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Migration
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will migrate existing chores and rewards to the new system.
          Make sure to backup your data before proceeding.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleMigration}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Run Migration'}
        </Button>

        {results && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Migration Results
            </Typography>
            <List>
              {results.choresProcessed !== undefined && (
                <ListItem>
                  <ListItemText 
                    primary="Chores Processed"
                    secondary={results.choresProcessed}
                  />
                </ListItem>
              )}
              {results.schedulesCreated !== undefined && (
                <ListItem>
                  <ListItemText 
                    primary="Schedules Created"
                    secondary={results.schedulesCreated}
                  />
                </ListItem>
              )}
              {results.earningsCreated !== undefined && (
                <ListItem>
                  <ListItemText 
                    primary="Earnings Created"
                    secondary={results.earningsCreated}
                  />
                </ListItem>
              )}
              {results.collectionsCreated && (
                <ListItem>
                  <ListItemText 
                    primary="Collections Created"
                    secondary={results.collectionsCreated.join(', ')}
                  />
                </ListItem>
              )}
              {results.errors && results.errors.length > 0 && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Errors"
                      secondary={
                        <List>
                          {results.errors.map((error, index) => (
                            <ListItem key={index}>
                              <ListItemText secondary={error} />
                            </ListItem>
                          ))}
                        </List>
                      }
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Box>
        )}

        {validation && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Validation Results
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Original Chores"
                  secondary={validation.originalChores}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="New Schedules"
                  secondary={validation.newSchedules}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Original Rewards"
                  secondary={validation.originalRewards}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="New Earnings"
                  secondary={validation.newEarnings}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Status"
                  secondary={
                    <Alert severity={validation.isValid ? "success" : "warning"}>
                      {validation.isValid ? "Migration Successful" : "Migration Incomplete"}
                    </Alert>
                  }
                />
              </ListItem>
              {validation.errors.length > 0 && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Validation Errors"
                      secondary={
                        <List>
                          {validation.errors.map((error, index) => (
                            <ListItem key={index}>
                              <ListItemText secondary={error} />
                            </ListItem>
                          ))}
                        </List>
                      }
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Setup Collections
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Initialize the chores, schedules, earnings, payment schedules, and payments collections.
          Only run this once when setting up the system.
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleSetupCollections}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Setup Collections'}
        </Button>

        {results && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Setup Results
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Message"
                  secondary={results.message}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Collections Created"
                  secondary={results.collectionsCreated.join(', ')}
                />
              </ListItem>
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
