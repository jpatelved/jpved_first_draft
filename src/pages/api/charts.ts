import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError || !profile || profile.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Only admins can upload charts' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const symbol = formData.get('symbol') as string;
        const notes = formData.get('notes') as string;

        if (!file || !symbol) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `charts/${Date.now()}-${symbol}.${fileExtension}`;

        const store = getStore('charts');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await store.set(fileName, buffer, {
            metadata: {
                contentType: file.type,
                originalName: file.name
            }
        });

        const imageUrl = `${request.url.split('/api/')[0]}/.netlify/blobs/serve/charts/${fileName}`;

        const { data: chart, error: insertError } = await supabase
            .from('charts')
            .insert({
                symbol: symbol.toUpperCase(),
                image_url: imageUrl,
                notes: notes || null,
                uploaded_by: user.id
            })
            .select()
            .single();

        if (insertError) {
            return new Response(JSON.stringify({ error: insertError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, chart }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Error uploading chart:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
