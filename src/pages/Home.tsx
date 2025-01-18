import React from 'react';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { ValidationResult } from '../types';
import * as validators from '../utils/validators';

export default function Home() {
  const [emails, setEmails] = useState<string>('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n');
    if (lines.length > 30) {
      // Only keep the first 30 lines
      setEmails(lines.slice(0, 30).join('\n'));
      setError('Maximum 30 email addresses allowed.');
    } else {
      setEmails(e.target.value);
      setError('');
    }
  };

  const validateEmails = async () => {
    setError('');
    const emailList = emails.split('\n').filter(email => email.trim());
    
    if (emailList.length > 30) {
      setError('Please enter no more than 30 emails for validation.');
      return;
    }

    setIsValidating(true);
    const validationResults: ValidationResult[] = [];

    for (const email of emailList) {
      const domain = email.split('@')[1];
      const formatValid = validators.validateEmailFormat(email);

      if (formatValid) {
        const domainExists = await validators.checkDomainExists(domain);
        
        if (!domainExists) {
          validationResults.push({
            email,
            formatValid: true,
            domainExists: false,
            mxRecords: false,
            spf: false,
            dkim: false,
            dmarc: false,
            smtp: false,
            blacklisted: false
          });
          continue;
        }

        const [mxRecords, spf, dkim, dmarc, smtp, blacklisted] = await Promise.all([
          validators.checkMXRecords(domain),
          validators.checkSPF(domain),
          validators.checkDKIM(domain),
          validators.checkDMARC(domain),
          validators.checkSMTP(domain),
          validators.checkBlacklists(domain)
        ]);

        validationResults.push({
          email,
          formatValid,
          domainExists,
          mxRecords,
          spf,
          dkim,
          dmarc,
          smtp,
          blacklisted
        });
      } else {
        validationResults.push({
          email,
          formatValid,
          domainExists: false,
          mxRecords: false,
          spf: false,
          dkim: false,
          dmarc: false,
          smtp: false,
          blacklisted: false
        });
      }
    }

    setResults(validationResults);
    setIsValidating(false);
  };

  const downloadResults = () => {
    const ws = utils.json_to_sheet(results);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Validation Results');
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-validation-results.xlsx';
    link.click();
  };

  const StatusIcon = ({ status }: { status: boolean }) => (
    <span className={`inline-block w-4 h-4 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">

          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter email addresses (one per line)
            </label>
            <textarea
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={emails}
              onChange={handleEmailChange}
              placeholder="example@domain.com"
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                const lines = pastedText.split('\n');
                if (lines.length > 30) {
                  e.preventDefault();
                  setEmails(lines.slice(0, 30).join('\n'));
                  setError('Maximum 30 email addresses allowed. Extra lines were removed.');
                }
              }}
            />
            <p className="text-sm text-gray-500 mt-2">
              Limited to 30 emails per batch for trial users. Need to validate more emails? <a href="/register">Signup for free!</a>
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={validateEmails}
              disabled={isValidating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Validate Emails</span>
                </>
              )}
            </button>

            {results.length > 0 && (
              <button
                onClick={downloadResults}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <span>Download Results</span>
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MX</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SPF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DKIM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DMARC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMTP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blacklisted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.formatValid} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{result.domainExists ? 'Registered' : 'Available'}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.mxRecords} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.spf} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.dkim} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.dmarc} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusIcon status={result.smtp} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{result.blacklisted ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}