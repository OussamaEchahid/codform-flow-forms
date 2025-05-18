
// This function filters out any form-title fields if they still exist in the database
export const filterOutTitleFields = (formData: any) => {
  if (!formData || !formData.data || !Array.isArray(formData.data)) return formData;
  
  const updatedData = formData.data.map((step: any) => {
    if (!step.fields || !Array.isArray(step.fields)) return step;
    
    return {
      ...step,
      fields: step.fields.filter((field: any) => 
        field.type !== 'form-title' && 
        field.type !== 'title' && 
        field.type !== 'edit-form-title'
      )
    };
  });
  
  return {
    ...formData,
    data: updatedData
  };
};
