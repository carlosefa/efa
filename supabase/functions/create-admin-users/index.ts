import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminUsers = [
      { 
        email: "hudson@efa.gg", 
        password: "123456", 
        display_name: "Hudson",
        role: "master"
      },
      { 
        email: "carlos@efa.gg", 
        password: "123456", 
        display_name: "Carlos",
        role: "global_admin"
      },
    ];

    const results = [];

    for (const admin of adminUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === admin.email);

      if (existingUser) {
        results.push({
          email: admin.email,
          status: "already_exists",
          message: `User ${admin.email} already exists`,
        });
        continue;
      }

      // Create the user with admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: admin.display_name,
          username: admin.display_name.toLowerCase(),
          must_change_password: true, // Flag for password change
        },
      });

      if (createError) {
        results.push({
          email: admin.email,
          status: "error",
          message: createError.message,
        });
        continue;
      }

      // The trigger should automatically assign the role, but let's ensure it
      if (newUser?.user) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({
            user_id: newUser.user.id,
            role: admin.role,
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,role"
          });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }
      }

      results.push({
        email: admin.email,
        status: "created",
        message: `User ${admin.email} created successfully with role ${admin.role}`,
        userId: newUser?.user?.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin users processed",
        results,
        note: "Users must change password on first login (123456 is the initial password)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating admin users:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
