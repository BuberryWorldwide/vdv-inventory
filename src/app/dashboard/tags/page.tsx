'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

interface Tag {
  _id: string;
  token: string;
  status: 'unlinked' | 'linked';
  machineId?: {
    _id: string;
    machineId: string;
    displayName?: string;
  };
  createdAt: string;
  linkedAt?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vdv-inventory.vercel.app';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlinked' | 'linked'>('all');
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [tagsToPrint, setTagsToPrint] = useState<Tag[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 100) {
      alert('Please enter a number between 1 and 100');
      return;
    }
    setGenerating(true);
    try {
      await api.generateTags(generateCount);
      await fetchTags();
      setShowGenerateModal(false);
      setGenerateCount(10);
    } catch (error: any) {
      alert(error.message || 'Failed to generate tags');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintUnlinked = () => {
    const unlinked = tags.filter(t => t.status === 'unlinked');
    if (unlinked.length === 0) {
      alert('No unlinked tags to print');
      return;
    }
    setTagsToPrint(unlinked);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VDV Asset Tags</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .page {
              width: 8.5in;
              padding: 0.25in;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.125in;
            }
            .tag {
              border: 1px dashed #ccc;
              padding: 0.15in;
              text-align: center;
              page-break-inside: avoid;
            }
            .tag svg { width: 1.2in; height: 1.2in; }
            .tag p { font-size: 7pt; margin-top: 4px; color: #666; }
            .tag .token { font-family: monospace; font-size: 6pt; color: #999; }
            @media print {
              .page { margin: 0; }
              .tag { border: 1px dashed #ccc; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredTags = tags.filter(tag => {
    if (filter === 'all') return true;
    return tag.status === filter;
  });

  const unlinkedCount = tags.filter(t => t.status === 'unlinked').length;
  const linkedCount = tags.filter(t => t.status === 'linked').length;

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Asset Tags</h1>
          <p className="text-sm text-gray-500">
            {tags.length} total · {unlinkedCount} available · {linkedCount} linked
          </p>
        </div>
        <div className="flex gap-2">
          {unlinkedCount > 0 && (
            <button
              onClick={handlePrintUnlinked}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50"
            >
              Print Unlinked ({unlinkedCount})
            </button>
          )}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            + Generate Tags
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All ({tags.length})
          </button>
          <button
            onClick={() => setFilter('unlinked')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'unlinked' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Available ({unlinkedCount})
          </button>
          <button
            onClick={() => setFilter('linked')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'linked' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Linked ({linkedCount})
          </button>
        </div>
      </div>

      {/* Tags grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTags.map((tag) => (
          <div
            key={tag._id}
            className={`bg-white rounded-lg shadow p-3 text-center ${tag.status === 'linked' ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}
          >
            <div className="flex justify-center mb-2">
              <QRCodeSVG
                value={`${BASE_URL}/m/${tag.token}`}
                size={80}
                level="M"
              />
            </div>
            <p className="text-xs font-mono text-gray-400 truncate" title={tag.token}>
              {tag.token.slice(0, 8)}...
            </p>
            {tag.status === 'linked' && tag.machineId ? (
              <Link
                href={`/dashboard/machines/${tag.machineId._id}`}
                className="text-xs text-blue-600 hover:underline block mt-1 truncate"
              >
                {tag.machineId.displayName || tag.machineId.machineId}
              </Link>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Available</p>
            )}
          </div>
        ))}
        {filteredTags.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            {filter === 'unlinked' ? 'No available tags. Generate some!' : 'No tags found.'}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How Asset Tags Work</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate tags (QR codes with unique IDs)</li>
          <li>Print and stick them on physical machines</li>
          <li>Scan a tag with your phone to see machine info</li>
          <li>First scan of unlinked tag lets you link it to a machine</li>
        </ol>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4">Generate Asset Tags</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many tags?
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">1-100 tags per batch</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Print Asset Tags ({tagsToPrint.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Print
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4 bg-gray-100 flex-1">
              <div ref={printRef}>
                <div className="page bg-white">
                  {tagsToPrint.map((tag) => (
                    <div key={tag._id} className="tag">
                      <QRCodeSVG
                        value={`${BASE_URL}/m/${tag.token}`}
                        size={100}
                        level="M"
                      />
                      <p>VDV Asset Tag</p>
                      <p className="token">{tag.token.slice(0, 12)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
