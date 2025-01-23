import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import PropTypes from 'prop-types';

const EarningsList = ({ earnings, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!earnings.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No unpaid earnings found.
      </Typography>
    );
  }

  const totalAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <>
      <List>
        {earnings.map((earning, index) => (
          <React.Fragment key={earning.id}>
            <ListItem>
              <ListItemText
                primary={`$${earning.amount.toFixed(2)}`}
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      Source: {earning.source.type}
                    </Typography>
                    <br />
                    <Typography variant="body2" component="span">
                      Date: {earning.createdAt.toDate().toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < earnings.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6">
          Total: ${totalAmount.toFixed(2)}
        </Typography>
      </Box>
    </>
  );
};

EarningsList.propTypes = {
  earnings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      source: PropTypes.shape({
        type: PropTypes.string.isRequired,
        referenceId: PropTypes.string
      }).isRequired,
      createdAt: PropTypes.object.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool
};

EarningsList.defaultProps = {
  loading: false
};

export default EarningsList;
