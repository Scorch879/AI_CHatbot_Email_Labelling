import sys
sys.path.insert(0, 'lifewood-hr-mcp')

from server import process_new_applicant_emails, get_latest_applicant_summary

print('Processing latest 3 applicants...')
result = process_new_applicant_emails(3)
print('Result:', result)

print('\nGetting latest applicant summary...')
summary = get_latest_applicant_summary(3)
print(summary)