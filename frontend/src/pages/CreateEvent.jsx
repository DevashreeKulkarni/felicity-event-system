import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizerNavbar from '../components/OrganizerNavbar';
import api from '../utils/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventType: 'Normal',
    startDate: '',
    endDate: '',
    venue: '',
    eligibility: 'IIIT Only',
    registrationDeadline: '',
    maxParticipants: '',
    registrationFee: 0,
    tags: '',
    // Team event fields
    isTeamEvent: false,
    minTeamSize: '',
    maxTeamSize: '',
    // Merchandise fields
    merchandisePrice: '',
    merchandiseStock: '',
    merchandiseDescription: ''
  });

  const [customForm, setCustomForm] = useState([]);
  const [currentField, setCurrentField] = useState({
    fieldName: '',
    fieldType: 'Text',
    isRequired: true,
    options: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addCustomField = () => {
    if (!currentField.fieldName.trim()) {
      alert('Please enter a field name');
      return;
    }

    const newField = {
      fieldName: currentField.fieldName,
      fieldType: currentField.fieldType,
      isRequired: currentField.isRequired,
      options: currentField.fieldType === 'Dropdown' 
        ? currentField.options.split(',').map(opt => opt.trim()).filter(Boolean)
        : []
    };

    setCustomForm(prev => [...prev, newField]);
    setCurrentField({
      fieldName: '',
      fieldType: 'Text',
      isRequired: true,
      options: ''
    });
  };

  const removeCustomField = (index) => {
    setCustomForm(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (statusValue) => {
    try {
      setLoading(true);

      console.log('\n========== FRONTEND: CREATE EVENT ==========');
      console.log('Status Parameter Received:', statusValue);
      console.log('Status Type:', typeof statusValue);
      console.log('===========================================\n');

      // Validation
      if (!formData.eventName.trim() || !formData.description.trim() || 
          !formData.startDate || !formData.endDate || !formData.venue.trim() ||
          !formData.registrationDeadline) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const deadline = new Date(formData.registrationDeadline);

      if (start >= end) {
        alert('End date must be after start date');
        setLoading(false);
        return;
      }

      if (deadline >= start) {
        alert('Registration deadline must be before event start date');
        setLoading(false);
        return;
      }

      // Prepare event data - EXACTLY matching backend expectations
      const eventData = {
        eventName: formData.eventName,
        eventDescription: formData.description,
        eventType: formData.eventType,
        eventStartDate: formData.startDate,
        eventEndDate: formData.endDate,
        venue: formData.venue,
        eligibility: formData.eligibility,
        registrationDeadline: formData.registrationDeadline,
        registrationLimit: formData.maxParticipants ? parseInt(formData.maxParticipants) : 999999,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        eventTags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        status: statusValue,  // CRITICAL: Pass the status explicitly
        customForm: customForm
      };

      // Add team event fields
      if (formData.isTeamEvent) {
        eventData.minTeamSize = parseInt(formData.minTeamSize);
        eventData.maxTeamSize = parseInt(formData.maxTeamSize);
      }

      // Add merchandise fields
      if (formData.eventType === 'Merchandise') {
        eventData.merchandiseDetails = {
          itemDetails: formData.merchandiseDescription,
          stockQuantity: parseInt(formData.merchandiseStock),
          purchaseLimit: 1
        };
      }

      console.log('Event Data Being Sent:');
      console.log('  - status:', eventData.status);
      console.log('  - All keys:', Object.keys(eventData));
      console.log('Full payload:', JSON.stringify(eventData, null, 2));
      console.log('');

      // Send request to backend
      const response = await api.post('/events', eventData);
      
      console.log('Response Received from Backend:');
      console.log('  - Returned status:', response.data.status);
      console.log('  - Event ID:', response.data._id);
      console.log('  - Event Name:', response.data.eventName);
      console.log('===========================================\n');
      
      alert(`Event ${statusValue === 'Draft' ? 'saved as draft' : 'published'} successfully!`);
      navigate('/organizer/dashboard');
      
    } catch (err) {
      console.error('Error creating event:', err);
      alert(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <OrganizerNavbar />
      <div style={{ padding: '30px 50px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
            Create New Event
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
            Fill in the event details and customize the registration form
          </p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' }}>
              Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="Enter event name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your event"
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Event Type *
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Normal">Normal Event</option>
                    <option value="Merchandise">Merchandise</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Eligibility *
                  </label>
                  <select
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="IIIT Only">IIIT Only</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Venue *
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="Event venue"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Max Participants
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    placeholder="Leave empty for unlimited"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={formData.registrationFee}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., Workshop, Technical, AI"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Team Event Section */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' }}>
              Team Event Settings
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isTeamEvent"
                  checked={formData.isTeamEvent}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  This is a team event
                </span>
              </label>
            </div>

            {formData.isTeamEvent && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Minimum Team Size *
                  </label>
                  <input
                    type="number"
                    name="minTeamSize"
                    value={formData.minTeamSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Maximum Team Size *
                  </label>
                  <input
                    type="number"
                    name="maxTeamSize"
                    value={formData.maxTeamSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Merchandise Section */}
          {formData.eventType === 'Merchandise' && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' }}>
                Merchandise Details
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="merchandisePrice"
                      value={formData.merchandisePrice}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="merchandiseStock"
                      value={formData.merchandiseStock}
                      onChange={handleInputChange}
                      placeholder="Available quantity"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Merchandise Description *
                  </label>
                  <textarea
                    name="merchandiseDescription"
                    value={formData.merchandiseDescription}
                    onChange={handleInputChange}
                    placeholder="Describe the merchandise (size, color, material, etc.)"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Registration Form Builder */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' }}>
              Custom Registration Form
            </h2>
            
            <div style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Field Name
                  </label>
                  <input
                    type="text"
                    name="fieldName"
                    value={currentField.fieldName}
                    onChange={handleFieldChange}
                    placeholder="e.g., College Name, Phone Number"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Field Type
                  </label>
                  <select
                    name="fieldType"
                    value={currentField.fieldType}
                    onChange={handleFieldChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Dropdown">Dropdown</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', height: '44px' }}>
                    <input
                      type="checkbox"
                      name="isRequired"
                      checked={currentField.isRequired}
                      onChange={handleFieldChange}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Required
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={addCustomField}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6B46C1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    height: '44px'
                  }}
                >
                  Add Field
                </button>
              </div>

              {currentField.fieldType === 'Dropdown' && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="options"
                    value={currentField.options}
                    onChange={handleFieldChange}
                    placeholder="e.g., Option 1, Option 2, Option 3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Display Custom Fields */}
            {customForm.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  Added Fields ({customForm.length})
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {customForm.map((field, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600', color: '#1F2937' }}>{field.fieldName}</span>
                        <span style={{ margin: '0 10px', color: '#6B7280' }}>•</span>
                        <span style={{ 
                          padding: '2px 8px',
                          backgroundColor: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {field.fieldType}
                        </span>
                        {field.isRequired && (
                          <>
                            <span style={{ margin: '0 10px', color: '#6B7280' }}>•</span>
                            <span style={{ 
                              padding: '2px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              Required
                            </span>
                          </>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                            Options: {field.options.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCustomField(index)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'flex-end',
            paddingTop: '20px',
            borderTop: '2px solid #E5E7EB'
          }}>
            <button
              onClick={() => navigate('/organizer/dashboard')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>

            <button
              onClick={() => handleSubmit('Draft')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>

            <button
              onClick={() => handleSubmit('Published')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6B46C1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
